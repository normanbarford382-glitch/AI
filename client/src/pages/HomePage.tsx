import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import HeroSection from '../components/home/HeroSection.tsx';
import { motion } from 'framer-motion';
import { ShoppingBag, Zap, Star, ArrowRight, Shield, Truck, HeadphonesIcon } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ProductCard from '../components/products/ProductCard';
import { useLocale } from '../context/LocaleContext';
import api from '../lib/api';
import type { Product, Category, Banner } from '../types';

interface HomeData {
  banners: Banner[];
  featuredProducts: Product[];
  categories: Category[];
  offerProducts: Product[];
  offersProducts: Product[];
}

export default function HomePage() {
  const { locale, isRTL } = useLocale();

  const { data, isLoading } = useQuery<HomeData>({
    queryKey: ['home'],
    queryFn: () => api.get<HomeData>('/home'),
  });

  const features = [
    { icon: Shield, titleAr: 'ضمان الجودة', titleEn: 'Quality Guarantee', descAr: 'جميع المنتجات مضمونة', descEn: 'All products guaranteed' },
    { icon: Truck, titleAr: 'شحن سريع', titleEn: 'Fast Shipping', descAr: 'توصيل سريع لبابك', descEn: 'Quick delivery to your door' },
    { icon: HeadphonesIcon, titleAr: 'دعم 24/7', titleEn: '24/7 Support', descAr: 'نحن دائماً هنا لمساعدتك', descEn: 'We are always here to help' },
  ];

 return (
  <div className="min-h-screen">
    <Navbar />
    <main>
      <HeroSection
        banners={data?.banners}
        locale={locale}
      />

      {/* Categories */}
      {data?.categories && data.categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl lg:text-3xl font-black text-foreground mb-8">
            {locale === 'ar' ? 'تصفح الأقسام' : 'Browse Categories'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-3 p-4 card-premium hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                    {cat.image ? (
                      <img src={cat.image} alt={locale === 'ar' ? cat.nameAr : cat.nameEn} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-2xl">💻</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-center text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {locale === 'ar' ? cat.nameAr : cat.nameEn}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {(data?.featuredProducts && data.featuredProducts.length > 0) || isLoading ? (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl lg:text-3xl font-black text-foreground">
              {locale === 'ar' ? 'منتجات مميزة' : 'Featured Products'}
            </h2>
            <Link href="/products?featured=true" className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
              {locale === 'ar' ? 'عرض الكل' : 'View All'}
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {data!.featuredProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </section>
      ) : null}

      {/* Special Offers */}
      {(data?.offersProducts ?? data?.offerProducts ?? []).length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl lg:text-3xl font-black text-foreground flex items-center gap-3">
              <span className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </span>
              {locale === 'ar' ? 'عروض خاصة' : 'Special Offers'}
            </h2>
            <Link href="/products?offers=true" className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
              {locale === 'ar' ? 'عرض الكل' : 'View All'}
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
            {(data?.offersProducts ?? data?.offerProducts ?? []).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </main>
    <Footer />
  </div>
);
}
