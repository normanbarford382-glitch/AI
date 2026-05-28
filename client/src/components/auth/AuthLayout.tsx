import { type ReactNode } from 'react';
import { Link } from 'wouter';
import { Laptop, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '../../context/LocaleContext';

const testimonials = [
  { ar: 'أفضل متجر للابتوبات. الجودة ممتازة والخدمة سريعة جداً!', en: 'Best laptop store. Excellent quality and very fast service!' },
  { ar: 'تجربة تسوق استثنائية، أنصح الجميع بالتعامل معهم.', en: 'Exceptional shopping experience, I recommend them to everyone.' },
  { ar: 'منتجات أصلية وأسعار تنافسية. خدمة العملاء رائعة!', en: 'Genuine products and competitive prices. Wonderful customer service!' },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const t = testimonials[Math.floor(Date.now() / 10000) % testimonials.length];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ─── Left / Right Panel (dark gold) — hidden on mobile ─── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative flex-col justify-between p-12 gold-shimmer overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-32 -start-32 w-80 h-80 rounded-full border border-yellow-500/10" />
        <div className="absolute -top-16 -start-16 w-56 h-56 rounded-full border border-yellow-500/10" />
        <div className="absolute -bottom-32 -end-32 w-96 h-96 rounded-full border border-yellow-500/10" />
        <div className="absolute bottom-24 end-12 w-48 h-48 rounded-full border border-yellow-500/8" />

        {/* Gold grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(43 90% 60%) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 premium-gradient rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Laptop className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tight leading-none">
                {isRTL ? 'متجر اللابتوبات' : 'Laptop Store'}
              </p>
              <p className="text-yellow-400/60 text-xs mt-0.5 tracking-widest uppercase">
                {isRTL ? 'الفاخر' : 'Premium'}
              </p>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="gold-line" />
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight">
              {isRTL ? (
                <>أفضل <span className="text-yellow-400">تجربة</span> تسوق<br />للابتوبات</>
              ) : (
                <>The Best <span className="text-yellow-400">Shopping</span><br />Experience</>
              )}
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              {isRTL
                ? 'جودة مضمونة، أسعار تنافسية، وخدمة عملاء على مدار الساعة. اكتشف عالماً من أفضل الأجهزة التقنية.'
                : 'Guaranteed quality, competitive prices, and 24/7 customer service. Discover a world of the best tech devices.'}
            </p>
            <div className="gold-line" />
          </div>

          {/* Testimonial */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-white/75 text-sm leading-relaxed italic">
              "{isRTL ? t.ar : t.en}"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 premium-gradient rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">★</span>
              </div>
              <span className="text-yellow-400/70 text-xs font-medium">
                {isRTL ? 'عميل موثوق' : 'Verified Customer'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { num: '5K+', labelAr: 'عميل راضٍ', labelEn: 'Happy Clients' },
            { num: '500+', labelAr: 'منتج', labelEn: 'Products' },
            { num: '99%', labelAr: 'رضا العملاء', labelEn: 'Satisfaction' },
          ].map((stat) => (
            <div key={stat.num} className="text-center">
              <p className="text-2xl font-black text-yellow-400">{stat.num}</p>
              <p className="text-white/40 text-xs mt-0.5">{isRTL ? stat.labelAr : stat.labelEn}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right / Left Panel (form) ─── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 bg-background min-h-screen lg:min-h-0">

        {/* Mobile logo only */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 premium-gradient rounded-2xl flex items-center justify-center shadow-lg">
              <Laptop className="w-7 h-7 text-white" />
            </div>
            <p className="text-xs text-muted-foreground tracking-widest uppercase font-semibold">
              {isRTL ? 'متجر اللابتوبات الفاخر' : 'Premium Laptop Store'}
            </p>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[420px] space-y-6"
        >
          {/* Gold accent line */}
          <div className="w-12 h-1 premium-gradient rounded-full" />

          {children}

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground pt-2">
            {isRTL
              ? 'بالمتابعة أنت توافق على شروط الاستخدام وسياسة الخصوصية.'
              : 'By continuing, you agree to our Terms of Service and Privacy Policy.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
