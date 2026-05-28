import { useState } from 'react';
import { X, BarChart2 } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import StorePageShell from '../components/shared/StorePageShell';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { useLocale } from '../context/LocaleContext';
import { formatPrice } from '../lib/utils';
import api from '../lib/api';
import type { Product } from '../types';

export default function ComparePage() {
  const { locale } = useLocale();
  const [productIds, setProductIds] = useState<string[]>([]);

  const { data } = useQuery<{ products: Product[] }>({
    queryKey: ['compare-products', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return { products: [] };
      const results = await Promise.allSettled(
        productIds.map(id => api.get<{ product: Product }>(`/products/${id}`))
      );
      const products = results.flatMap(r => (r.status === 'fulfilled' ? [r.value.product] : []));
      return { products: products.filter(Boolean) };
    },
    enabled: productIds.length > 0,
  });

  const products = data?.products || [];
  const removeProduct = (id: string) => setProductIds(prev => prev.filter(p => p !== id));

  if (productIds.length === 0) {
    return (
      <StorePageShell mainClassName="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={BarChart2}
          title={locale === 'ar' ? 'قارن بين المنتجات' : 'Compare Products'}
          description={
            locale === 'ar'
              ? 'أضف منتجات من صفحة المنتجات لمقارنتها هنا'
              : 'Add products from the catalog to compare them here'
          }
          action={
            <Link href="/products" className="btn-primary-lg">
              {locale === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
            </Link>
          }
        />
      </StorePageShell>
    );
  }

  const specs = ['nameAr', 'nameEn', 'brand', 'price', 'discountPrice', 'stock'] as const;
  const specLabels: Record<string, { ar: string; en: string }> = {
    nameAr: { ar: 'الاسم (عربي)', en: 'Name (Arabic)' },
    nameEn: { ar: 'الاسم (إنجليزي)', en: 'Name (English)' },
    brand: { ar: 'الماركة', en: 'Brand' },
    price: { ar: 'السعر', en: 'Price' },
    discountPrice: { ar: 'سعر التخفيض', en: 'Discount Price' },
    stock: { ar: 'المخزون', en: 'Stock' },
  };

  return (
    <StorePageShell>
      <PageHeader title={locale === 'ar' ? 'مقارنة المنتجات' : 'Compare Products'} />

      <div className="card-premium p-4 overflow-x-auto">
        <div className="min-w-max">
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${products.length}, 220px)` }}>
            <div />
            {products.map(product => (
              <div key={product.id} className="bg-muted/40 border border-border rounded-2xl p-4 relative">
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="absolute top-2 end-2 w-6 h-6 flex items-center justify-center rounded-full bg-card hover:bg-destructive/10 hover:text-destructive transition-all"
                  aria-label="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
                {product.thumbnail && (
                  <img src={product.thumbnail} alt="" className="w-full h-28 object-cover rounded-xl mb-3" />
                )}
                <p className="font-semibold text-sm line-clamp-2">
                  {locale === 'ar' ? product.nameAr : product.nameEn}
                </p>
              </div>
            ))}
          </div>

          {specs.map(spec => (
            <div
              key={spec}
              className="grid gap-4 mt-2"
              style={{ gridTemplateColumns: `200px repeat(${products.length}, 220px)` }}
            >
              <div className="flex items-center px-3 py-2.5 bg-muted rounded-xl">
                <span className="text-xs font-semibold text-muted-foreground">
                  {locale === 'ar' ? specLabels[spec]?.ar : specLabels[spec]?.en}
                </span>
              </div>
              {products.map(product => (
                <div
                  key={product.id}
                  className="flex items-center px-3 py-2.5 bg-card border border-border rounded-xl"
                >
                  <span className="text-sm">
                    {spec === 'price'
                      ? formatPrice(product.price)
                      : spec === 'discountPrice'
                        ? product.discountPrice != null ? formatPrice(product.discountPrice) : '—'
                        : spec === 'brand'
                          ? (product.brand ?? '—')
                          : spec === 'stock'
                            ? String(product.stock)
                            : spec === 'nameAr'
                              ? product.nameAr
                              : product.nameEn}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </StorePageShell>
  );
}
