import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Shield, Truck, Headphones } from 'lucide-react';
import type { Banner } from '../../types';

interface HeroSectionProps {
  banners?: Banner[];
  locale: string;
}

const defaultSlides = [
  {
    titleAr: 'اكتشف عالم اللابتوبات',
    titleEn: 'Discover the World of Laptops',
    subtitleAr: 'أحدث الموديلات بأفضل الأسعار. جودة مضمونة، وشحن سريع إلى باب منزلك.',
    subtitleEn: 'Latest models at the best prices. Guaranteed quality, fast shipping to your door.',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1600&q=80',
    fromDb: false,
  },
  {
    titleAr: 'تشكيلة واسعة من الاكسسوارات',
    titleEn: 'Wide Range of Accessories',
    subtitleAr: 'كل ما تحتاجه لإكمال تجربتك التقنية في مكان واحد.',
    subtitleEn: 'Everything you need to complete your tech experience in one place.',
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1600&q=80',
    fromDb: false,
  },
  {
    titleAr: 'عروض حصرية لا تفوتها',
    titleEn: 'Exclusive Deals You Cannot Miss',
    subtitleAr: 'خصومات كبيرة على أشهر الماركات العالمية. محدود لفترة معينة فقط!',
    subtitleEn: 'Huge discounts on the most popular global brands. Limited time only!',
    image: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=1600&q=80',
    fromDb: false,
  },
];

const features = [
  { icon: Shield, ar: 'ضمان الجودة', en: 'Quality Guarantee', descAr: 'جميع المنتجات مضمونة', descEn: 'All products guaranteed' },
  { icon: Truck, ar: 'شحن سريع', en: 'Fast Shipping', descAr: 'توصيل سريع لباب منزلك', descEn: 'Fast delivery to your door' },
  { icon: Headphones, ar: 'دعم 24/7', en: '24/7 Support', descAr: 'نحن دائما هنا لمساعدتك', descEn: 'We are always here to help' },
];

export default function HeroSection({ banners, locale }: HeroSectionProps) {
  const isRTL = locale === 'ar';
  const [current, setCurrent] = useState(0);

  // When banners come from DB we display them as-is (no color overlay)
  const slides = banners && banners.length > 0
    ? banners.map((b) => ({
        titleAr: b.titleAr || '',
        titleEn: b.titleEn || '',
        subtitleAr: b.subtitleAr || '',
        subtitleEn: b.subtitleEn || '',
        image: b.image,
        fromDb: true,
      }))
    : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);
  const slide = slides[current];
  const title   = isRTL ? slide.titleAr : slide.titleEn;
  const subtitle = isRTL ? slide.subtitleAr : slide.subtitleEn;
  const hasText  = title || subtitle;

  return (
    <section className="relative">
      <div className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden rounded-3xl mx-4 lg:mx-8 mt-4 shadow-2xl">

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {/* Banner image — displayed exactly as uploaded, no color distortion */}
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />

            {/* Subtle bottom gradient only when there is text to show (default slides) */}
            {!slide.fromDb && hasText && (
              <div
                className={`absolute inset-0 bg-gradient-to-${isRTL ? 'l' : 'r'} from-black/65 via-black/30 to-transparent`}
              />
            )}

            {/* DB banners: very subtle vignette so corners look clean but image is untouched */}
            {slide.fromDb && (
              <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.15)] pointer-events-none" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Text content — shown only when there is a title */}
        {hasText && (
          <div className="relative z-10 h-full flex items-center">
            <div className="container mx-auto px-6 lg:px-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, x: isRTL ? 60 : -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? -60 : 60 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-2xl space-y-6"
                >
                  {title && (
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-white/85 text-lg leading-relaxed max-w-lg drop-shadow">
                      {subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-4 flex-wrap">
                    <Link
                      href="/products"
                      className="bg-white text-black px-8 py-3.5 rounded-2xl font-bold text-base hover:bg-yellow-50 transition-all shadow-xl active:scale-95 border border-white/80"
                    >
                      {isRTL ? 'تسوق الآن' : 'Shop Now'}
                    </Link>
                    <Link
                      href="/products"
                      className="bg-black/30 backdrop-blur-sm text-white border border-white/30 px-8 py-3.5 rounded-2xl font-bold hover:bg-black/40 transition-all"
                    >
                      {isRTL ? 'استكشف العروض' : 'Explore Offers'}
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={isRTL ? next : prev}
              className="absolute start-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/50 transition-all"
              aria-label="Previous"
            >
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
            <button
              onClick={isRTL ? prev : next}
              className="absolute end-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/50 transition-all"
              aria-label="Next"
            >
              {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-8 h-2 bg-yellow-400'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Feature cards */}
      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 premium-gradient rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <f.icon className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">{isRTL ? f.ar : f.en}</h3>
                <p className="text-muted-foreground text-xs">{isRTL ? f.descAr : f.descEn}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
