import { Link } from 'wouter';
import { motion } from 'framer-motion';
import type { Category } from '../../types';

interface CategorySectionProps {
  categories: Category[];
  locale: string;
}

export default function CategorySection({ categories, locale }: CategorySectionProps) {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl lg:text-3xl font-black text-foreground mb-8">
        {locale === 'ar' ? 'تصفح الأقسام' : 'Browse Categories'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link
              href={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
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
  );
}
