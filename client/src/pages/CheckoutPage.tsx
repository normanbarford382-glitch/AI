import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle, Wallet, Banknote, Tag, Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import StorePageShell from '../components/shared/StorePageShell';
import EmptyState from '../components/shared/EmptyState';
import PageHeader from '../components/shared/PageHeader';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useCartStore } from '../lib/store';
import { formatPrice } from '../lib/utils';
import { normalizeCheckoutPaymentMode } from '../lib/checkoutPayment';
import { WALLET_QUERY_KEY } from '../lib/siteSettings';
import api from '../lib/api';

export default function CheckoutPage() {
  const { locale, isRTL } = useLocale();
  const { isAuthenticated } = useAuth();
  const { settings, walletEnabled: siteWalletEnabled, checkoutPaymentMode: siteCheckoutMode } = useSiteSettings();
  const [, navigate] = useLocation();
  const { items, total, clearCart } = useCartStore();

  const checkoutMode = siteCheckoutMode ?? normalizeCheckoutPaymentMode(settings.checkoutPaymentMode);
  const codAllowed = checkoutMode === 'cod' || checkoutMode === 'both';
  const walletAllowed = (checkoutMode === 'wallet' || checkoutMode === 'both') && siteWalletEnabled;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [shippingBranch, setShippingBranch] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [useWallet, setUseWallet] = useState(checkoutMode === 'wallet');
  const [notes, setNotes] = useState('');
  const [orderId, setOrderId] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: walletData } = useQuery<{ wallet: { balance: number } | null }>({
    queryKey: WALLET_QUERY_KEY,
    queryFn: () => api.get('/wallet'),
    enabled: isAuthenticated && siteWalletEnabled,
  });

  useEffect(() => {
    if (checkoutMode === 'wallet') setUseWallet(true);
    if (checkoutMode === 'cod') setUseWallet(false);
  }, [checkoutMode]);

  const cartTotal = total();
  const walletBalance = walletData?.wallet?.balance ?? 0;
  const walletPayAvailable = siteWalletEnabled && walletAllowed;

  const mutation = useMutation({
    mutationFn: () => api.post<{ order: { id: string } }>('/orders', {
      fullName, phone, address,
      shippingBranch: shippingBranch || undefined,
      useWallet,
      couponCode: couponCode.trim() || undefined,
      notes: notes.trim() || undefined,
      lang: locale,
      items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
    }),
    onSuccess: (data) => {
      setOrderId(data.order.id);
      setSuccess(true);
      clearCart();
      toast.success(locale === 'ar' ? 'تم تأكيد طلبك بنجاح!' : 'Order placed successfully!');
    },
    onError: (err: Error) => {
      toast.error(err.message || (locale === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'An error occurred, please try again'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (items.length === 0) { toast.error(locale === 'ar' ? 'السلة فارغة' : 'Cart is empty'); return; }
    if (!fullName.trim() || !phone.trim() || !address.trim() || !shippingBranch.trim()) {
      toast.error(locale === 'ar' ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (useWallet && walletAllowed && walletBalance < cartTotal) {
      toast.error(locale === 'ar'
        ? `لا يوجد رصيد كافٍ. الرصيد الحالي: ${formatPrice(walletBalance)}`
        : `Insufficient balance. Current: ${formatPrice(walletBalance)}`);
      return;
    }
    if (checkoutMode === 'wallet' && !useWallet) {
      toast.error(locale === 'ar' ? 'يجب الدفع من المحفظة' : 'Wallet payment is required');
      return;
    }
    mutation.mutate();
  };

  if (success) {
    return (
      <StorePageShell mainClassName="flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md space-y-6 card-premium p-10">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'تم تأكيد طلبك!' : 'Order Confirmed!'}</h2>
            <p className="text-muted-foreground">
              {locale === 'ar' ? 'رقم الطلب:' : 'Order number:'}
              {' '}<span className="font-bold text-foreground">#{orderId.slice(-8).toUpperCase()}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {locale === 'ar' ? 'سيتم التواصل معك قريباً لتأكيد التوصيل' : 'We will contact you soon to confirm delivery'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button type="button" onClick={() => navigate('/orders')} className="btn-primary-lg">
                {locale === 'ar' ? 'طلباتي' : 'My Orders'}
              </button>
              <button type="button" onClick={() => navigate('/')} className="px-6 py-3 border border-border rounded-xl font-semibold hover:bg-accent transition-colors">
                {locale === 'ar' ? 'الرئيسية' : 'Home'}
              </button>
            </div>
          </motion.div>
      </StorePageShell>
    );
  }

  if (items.length === 0) {
    return (
      <StorePageShell mainClassName="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={ShoppingBag}
          title={locale === 'ar' ? 'السلة فارغة' : 'Cart is empty'}
          action={
            <Link href="/products" className="btn-primary-lg">
              {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
            </Link>
          }
        />
      </StorePageShell>
    );
  }

  return (
    <StorePageShell>
        <PageHeader
          title={locale === 'ar' ? 'تأكيد الطلب' : 'Checkout'}
          action={
            <button type="button" onClick={() => navigate('/cart')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl border border-border">
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              {locale === 'ar' ? 'السلة' : 'Cart'}
            </button>
          }
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <div className="card-premium p-6 space-y-4">
              <h2 className="font-bold text-foreground text-lg">{locale === 'ar' ? 'بيانات التوصيل' : 'Delivery Information'}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{locale === 'ar' ? 'الاسم الثلاثي *' : 'Full Name *'}</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} required
                    placeholder={locale === 'ar' ? 'الاسم الأول والثاني والثالث' : 'First, middle and last name'}
                    className="input-premium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{locale === 'ar' ? 'رقم واتساب *' : 'WhatsApp Number *'}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} required
                    placeholder="+963..."
                    className="input-premium" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'المحافظة *' : 'Governorate *'}</label>
                <input value={address} onChange={e => setAddress(e.target.value)} required
                  placeholder={locale === 'ar' ? 'مثال: دمشق، حلب، حمص...' : 'e.g. Damascus, Aleppo...'}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'أقرب فرع شحن *' : 'Nearest Shipping Branch *'}</label>
                <input value={shippingBranch} onChange={e => setShippingBranch(e.target.value)} required
                  placeholder={locale === 'ar' ? 'اسم أقرب فرع شحن لك' : 'Name of nearest shipping branch'}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'تفاصيل إضافية' : 'Additional Details'}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder={locale === 'ar' ? 'أي تعليمات أو ملاحظات إضافية...' : 'Any additional notes or instructions...'}
                  className="input-premium resize-none" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <h2 className="font-bold text-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-primary" />{locale === 'ar' ? 'كوبون الخصم' : 'Discount Coupon'}</h2>
              <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder={locale === 'ar' ? 'أدخل كوبون الخصم' : 'Enter coupon code'}
                className="input-premium tracking-widest" />
            </div>

            <div className="card-premium p-6 space-y-4">
              <h2 className="font-bold text-foreground">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</h2>
              {checkoutMode === 'wallet' && (
                <p className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  {locale === 'ar' ? 'الدفع من المحفظة فقط' : 'Wallet payment only'}
                </p>
              )}
              {checkoutMode === 'cod' && (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  {locale === 'ar' ? 'الدفع عند الاستلام فقط' : 'Cash on delivery only'}
                </p>
              )}
              <div className="space-y-3">
                {codAllowed && (
                <button type="button" onClick={() => setUseWallet(false)}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-2xl transition-all ${!useWallet ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!useWallet ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="text-start">
                    <p className="font-semibold text-sm">{locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</p>
                    <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'ادفع عند وصول الطلب' : 'Pay when order arrives'}</p>
                  </div>
                  <div className={`ms-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${!useWallet ? 'border-primary' : 'border-border'}`}>
                    {!useWallet && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </div>
                </button>
                )}

                {walletPayAvailable && (
                  <button type="button" onClick={() => setUseWallet(true)}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-2xl transition-all ${useWallet ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${useWallet ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <p className="font-semibold text-sm">{locale === 'ar' ? 'الدفع من المحفظة' : 'Pay from Wallet'}</p>
                      <p className="text-xs text-muted-foreground">
                        {locale === 'ar' ? `الرصيد: ${formatPrice(walletBalance)}` : `Balance: ${formatPrice(walletBalance)}`}
                      </p>
                    </div>
                    <div className={`ms-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${useWallet ? 'border-primary' : 'border-border'}`}>
                      {useWallet && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                  </button>
                )}

                {useWallet && walletPayAvailable && walletBalance < cartTotal && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                    ⚠️ {locale === 'ar'
                      ? `لا يوجد رصيد كافٍ. تحتاج ${formatPrice(cartTotal)} والرصيد الحالي ${formatPrice(walletBalance)}`
                      : `Insufficient balance. Need ${formatPrice(cartTotal)}, current balance ${formatPrice(walletBalance)}`}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={mutation.isPending || (useWallet && walletPayAvailable && walletBalance < cartTotal)}
              className="w-full btn-primary-lg text-lg py-4 disabled:opacity-60 disabled:cursor-not-allowed">
              {mutation.isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" />{locale === 'ar' ? 'جاري تأكيد الطلب...' : 'Placing order...'}</>
              ) : (
                <><CheckCircle className="w-5 h-5" />{locale === 'ar' ? 'تأكيد الطلب' : 'Place Order'}</>
              )}
            </button>
          </form>

          <div className="space-y-4">
            <div className="card-premium p-5 lg:sticky lg:top-24">
              <h2 className="font-bold text-foreground mb-4">{locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatPrice((item.discountPrice ?? item.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'المجموع' : 'Subtotal'}</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  <span className="text-green-600">{locale === 'ar' ? 'مجاني' : 'Free'}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-primary">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </StorePageShell>
  );
}
