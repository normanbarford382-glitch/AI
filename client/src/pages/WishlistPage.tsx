import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link } from 'wouter';
import StorePageShell from '../components/shared/StorePageShell';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import ProductCard from '../components/products/ProductCard';
import { useLocale } from '../context/LocaleContext';
import { useWishlistStore } from '../lib/store';
import api from '../lib/api';
import type { Product } from '../types';

export default function WishlistPage() {
  const { locale } = useLocale();
  const { ids } = useWishlistStore();

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['wishlist-products', ids],
    queryFn: async () => {
      if (ids.length === 0) return { products: [] };
      const results = await Promise.allSettled(ids.map(id => api.get<{ product: Product }>(`/products/${id}`)));
      const products = results.flatMap(r => (r.status === 'fulfilled' ? [r.value.product] : []));
      return { products: products.filter(Boolean) };
    },
    enabled: ids.length > 0,
  });

  return (
    <StorePageShell>
      <PageHeader
        title={locale === 'ar' ? 'المفضلة' : 'Wishlist'}
        subtitle={ids.length > 0 ? (locale === 'ar' ? `${ids.length} منتج` : `${ids.length} item(s)`) : undefined}
      />

      {ids.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={locale === 'ar' ? 'قائمة المفضلة فارغة' : 'Wishlist is empty'}
          description={locale === 'ar' ? 'أضف منتجات للمفضلة من صفحة المنتجات' : 'Save products from the catalog to your wishlist'}
          action={
            <Link href="/products" className="btn-primary-lg">
              {locale === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
            </Link>
          }
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {data!.products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </StorePageShell>
  );
}
