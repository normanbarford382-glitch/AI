import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Wrench, Save, Loader2, Upload, CreditCard } from 'lucide-react';
import { normalizeCheckoutPaymentMode, type CheckoutPaymentMode } from '../../lib/checkoutPayment';
import toast from 'react-hot-toast';
import { Link } from 'wouter';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import api from '../../lib/api';
import { SITE_SETTINGS_QUERY_KEY, WALLET_QUERY_KEY, parseSettingBool, isWalletEnabled } from '../../lib/siteSettings';

function normalizeSettings(raw: Record<string, string | null | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = value == null ? '' : String(value);
  }
  if (out.logo && !out.siteLogo) out.siteLogo = out.logo;
  if (out.siteLogo && !out.logo) out.logo = out.siteLogo;
  out.walletEnabled = isWalletEnabled(out) ? 'true' : 'false';
  return out;
}

export default function AdminSettings() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get<{ settings: Record<string, string> }>('/admin/settings'),
  });

  useEffect(() => {
    if (data?.settings) setSettings(normalizeSettings(data.settings));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      api.put<{ success: boolean; settings: Record<string, string> }>('/admin/settings', payload),
    onSuccess: async (res, payload) => {
      const saved = normalizeSettings(res.settings ?? payload);
      setSettings(saved);
      qc.setQueryData(['admin-settings'], { settings: saved });
      qc.setQueryData(SITE_SETTINGS_QUERY_KEY, { settings: saved });
      await qc.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY });
      await qc.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
      toast.success(locale === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = (key: string, value: string) => setSettings(p => ({ ...p, [key]: value }));
  const toggle = (key: string) => update(key, parseSettingBool(settings[key]) ? 'false' : 'true');

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const res = await api.post<{ url?: string }>('/upload', {
            base64, folder: 'laptopstore/settings',
          });
          if (!res.url) throw new Error(locale === 'ar' ? 'لم يتم استلام رابط الشعار' : 'Logo URL missing from upload');
          update('siteLogo', res.url);
          toast.success(locale === 'ar' ? 'تم رفع الشعار' : 'Logo uploaded');
        } catch (err: any) {
          toast.error(err.message || (locale === 'ar' ? 'فشل رفع الشعار' : 'Failed to upload logo'));
        } finally {
          setUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingLogo(false);
      toast.error(locale === 'ar' ? 'فشل رفع الشعار' : 'Failed to upload logo');
    }
  };

  const Field = ({ k, label, type = 'text', placeholder }: { k: string; label: string; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {type === 'textarea' ? (
        <textarea value={settings[k] || ''} onChange={e => update(k, e.target.value)} rows={2} placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      ) : (
        <input type={type} value={settings[k] || ''} onChange={e => update(k, e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      )}
    </div>
  );

  const Toggle = ({ k, label, desc }: { k: string; label: string; desc?: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <button onClick={() => toggle(k)} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${parseSettingBool(settings[k]) ? 'bg-primary' : 'bg-muted'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${parseSettingBool(settings[k]) ? (locale === 'ar' ? 'right-0.5' : 'left-[calc(100%-22px)]') : (locale === 'ar' ? 'right-[calc(100%-22px)]' : 'left-0.5')}`} />
      </button>
    </div>
  );

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'إعدادات الموقع' : 'Site Settings'}</h1>
          <button onClick={() => saveMutation.mutate(normalizeSettings(settings))} disabled={saveMutation.isPending || uploadingLogo}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
          </button>
        </div>

        {/* Site Identity */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border bg-accent/30">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-bold">{locale === 'ar' ? 'هوية الموقع' : 'Site Identity'}</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Logo */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{locale === 'ar' ? 'شعار الموقع' : 'Site Logo'}</label>
              <div className="flex items-center gap-4">
                {settings.siteLogo && (
                  <div className="w-16 h-16 bg-muted rounded-xl border border-border overflow-hidden flex items-center justify-center">
                    <img src={settings.siteLogo} alt="logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <button type="button" onClick={() => logoRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-all disabled:opacity-50">
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {locale === 'ar' ? 'رفع شعار جديد' : 'Upload Logo'}
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
              </div>
              <Field k="siteLogo" label={locale === 'ar' ? 'أو أدخل رابط الشعار' : 'Or enter logo URL'} placeholder="https://..." />
            </div>
            <Field k="siteName" label={locale === 'ar' ? 'اسم الموقع' : 'Site Name'} placeholder="LaptopStore" />
            <Field k="contactEmail" label={locale === 'ar' ? 'البريد الإلكتروني' : 'Contact Email'} type="email" />
            <Field k="contactPhone" label={locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'} />
            <Field k="address" label={locale === 'ar' ? 'العنوان' : 'Address'} />
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border bg-accent/30">
            <h2 className="font-bold">{locale === 'ar' ? 'روابط التواصل الاجتماعي' : 'Social Media Links'}</h2>
          </div>
          <div className="p-5 space-y-4">
            <Field k="facebook" label="Facebook" placeholder="https://facebook.com/..." />
            <Field k="instagram" label="Instagram" placeholder="https://instagram.com/..." />
            <Field k="twitter" label="Twitter/X" placeholder="https://twitter.com/..." />
            <Field k="whatsapp" label="WhatsApp" placeholder="+963..." />
          </div>
        </div>

        {/* Feature toggles */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border bg-accent/30">
            <Wrench className="w-5 h-5 text-primary" />
            <h2 className="font-bold">{locale === 'ar' ? 'إعدادات النظام' : 'System Settings'}</h2>
          </div>
          <div className="p-5">
            <Toggle k="walletEnabled"
              label={locale === 'ar' ? 'تفعيل المحفظة' : 'Enable Wallet'}
              desc={locale === 'ar' ? 'السماح للمستخدمين بالدفع من المحفظة' : 'Allow users to pay from wallet'} />
            <Toggle k="otpEnabled"
              label={locale === 'ar' ? 'إرسال OTP عبر الإيميل' : 'Send OTP via Email'}
              desc={locale === 'ar' ? 'إرسال رمز التحقق للتسجيل عبر البريد الإلكتروني' : 'Send verification code via email on registration'} />
            <Toggle k="maintenanceMode"
              label={locale === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}
              desc={locale === 'ar' ? 'إيقاف الموقع مؤقتاً للصيانة' : 'Temporarily disable the site for maintenance'} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border bg-accent/30">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-bold">{locale === 'ar' ? 'طرق الدفع عند الطلب' : 'Checkout Payment'}</h2>
          </div>
          <div className="p-5 space-y-2">
            {([
              { value: 'both' as CheckoutPaymentMode, ar: 'المحفظة + الدفع عند الاستلام', en: 'Wallet + Cash on Delivery' },
              { value: 'wallet' as CheckoutPaymentMode, ar: 'المحفظة فقط', en: 'Wallet only' },
              { value: 'cod' as CheckoutPaymentMode, ar: 'الدفع عند الاستلام فقط', en: 'Cash on Delivery only' },
            ]).map(opt => {
              const current = normalizeCheckoutPaymentMode(settings.checkoutPaymentMode);
              const selected = current === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('checkoutPaymentMode', opt.value)}
                  className={`w-full text-start px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    selected ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/30'
                  }`}
                >
                  {locale === 'ar' ? opt.ar : opt.en}
                </button>
              );
            })}
            <p className="text-xs text-muted-foreground pt-2">
              {locale === 'ar'
                ? 'يتحكم بخيارات الدفع في صفحة إتمام الطلب. طرق شحن المحفظة تُدار من صفحة طرق الدفع.'
                : 'Controls payment options at checkout. Wallet recharge methods are managed under Payment Methods.'}
            </p>
            <Link href="/admin/payment-methods" className="inline-block text-sm text-primary font-semibold hover:underline">
              {locale === 'ar' ? 'إدارة طرق شحن المحفظة ←' : 'Manage wallet recharge methods →'}
            </Link>
          </div>
        </div>

        <button onClick={() => saveMutation.mutate(normalizeSettings(settings))} disabled={saveMutation.isPending || uploadingLogo}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all disabled:opacity-60 shadow-xl shadow-primary/20">
          {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {locale === 'ar' ? 'حفظ جميع الإعدادات' : 'Save All Settings'}
        </button>
      </div>
    </AdminLayout>
  );
}
