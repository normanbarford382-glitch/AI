'use client';

import ProductCard from '@/components/products/ProductCard';
import type { Product } from '@/types';

export default function FeaturedProducts({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {/* Empty state - products will appear here once added from admin */}
        <p>لا توجد منتجات مميزة حالياً. أضفها من لوحة التحكم.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
