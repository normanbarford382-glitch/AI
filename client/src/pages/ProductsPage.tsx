import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { SlidersHorizontal, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import StorePageShell from '../components/shared/StorePageShell';
import PageHeader from '../components/shared/PageHeader';
import ProductCard from '../components/products/ProductCard';
import { useLocale } from '../context/LocaleContext';
import api from '../lib/api';
import type { Product, Category } from '../types';

interface ProductsResponse {
  products: Product[];
  total: number;
  totalPages: number;
  page: number;
  categories: Category[];
  brands: string[];
}

export default function ProductsPage() {
  const { locale, isRTL } = useLocale();
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const featured = params.get('featured') === 'true';
  const offers = params.get('offers') === 'true';

  const queryParams = new URLSearchParams({
    page: String(page), limit: '12', sort,
    ...(search && { q: search }),
    ...(category && { category }),
    ...(brand && { brand }),
    ...(minPrice && { minPrice }),
    ...(maxPrice && { maxPrice }),
    ...(featured && { featured: 'true' }),
    ...(offers && { offers: 'true' }),
  });

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ['products', queryParams.toString()],
    queryFn: () => api.get<ProductsResponse>(`/products?${queryParams}`),
  });

  const pageTitle = offers ? (locale === 'ar' ? 'العروض الخاصة' : 'Special Offers')
    : featured ? (locale === 'ar' ? 'المنتجات المميزة' : 'Featured Products')
    : (locale === 'ar' ? 'جميع المنتجات' : 'All Products');

  return (
    <StorePageShell>
        <PageHeader
          title={pageTitle}
          subtitle={data ? (locale === 'ar' ? `${data.total} منتج متاح` : `${data.total} products available`) : undefined}
          action={
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-all card-premium">
              <SlidersHorizontal className="w-4 h-4" />
              {locale === 'ar' ? 'فلتر' : 'Filter'}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          }
        />

        {showFilters && (
          <div className="card-premium p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute top-3 start-3 w-4 h-4 text-muted-foreground" />
              <input
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                className="input-premium ps-9"
              />
            </div>
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="input-premium">
              <option value="">{locale === 'ar' ? 'كل الأقسام' : 'All Categories'}</option>
              {data?.categories.map(c => (
                <option key={c.id} value={c.slug}>{locale === 'ar' ? c.nameAr : c.nameEn}</option>
              ))}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="input-premium">
              <option value="newest">{locale === 'ar' ? 'الأحدث' : 'Newest'}</option>
              <option value="price_asc">{locale === 'ar' ? 'السعر: الأقل أولاً' : 'Price: Low to High'}</option>
              <option value="price_desc">{locale === 'ar' ? 'السعر: الأعلى أولاً' : 'Price: High to Low'}</option>
            </select>
            <select value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}
              className="input-premium">
              <option value="">{locale === 'ar' ? 'كل الماركات' : 'All Brands'}</option>
              {data?.brands.map(b => b && <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(12)].map((_, i) => <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : data?.products.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-5xl">🔍</p>
            <h3 className="text-xl font-bold text-foreground">{locale === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}</h3>
            <p className="text-muted-foreground">{locale === 'ar' ? 'حاول تغيير فلاتر البحث' : 'Try adjusting your search filters'}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {locale === 'ar' ? `${data?.total} منتج` : `${data?.total} products`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {data!.products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent disabled:opacity-40 transition-all">
                  {locale === 'ar' ? 'السابق' : 'Prev'}
                </button>
                <span className="px-4 py-2 text-sm font-medium">{page} / {data.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                  className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent disabled:opacity-40 transition-all">
                  {locale === 'ar' ? 'التالي' : 'Next'}
                </button>
              </div>
            )}
          </>
        )}
    </StorePageShell>
  );
}
