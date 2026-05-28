import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye, Star, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore, useWishlistStore } from '../../lib/store';
import { cn, formatPrice, getDiscountPercent } from '../../lib/utils';
import { useLocale } from '../../context/LocaleContext';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { locale, isRTL } = useLocale();
  const addToCart = useCartStore((s) => s.addItem);
  const { toggle: toggleWishlist, has: inWishlist } = useWishlistStore();
  const [imageError, setImageError] = useState(false);

  const name = locale === 'ar' ? product.nameAr : product.nameEn;
  const isWishlisted = inWishlist(product.id);
  const effectivePrice = product.discountPrice ?? product.price;
  const discountPercent = product.discountPrice ? getDiscountPercent(product.price, product.discountPrice) : 0;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart({
      id: product.id,
      name,
      price: product.price,
      discountPrice: product.discountPrice ?? undefined,
      image: product.images?.[0] || product.thumbnail || 'https://via.placeholder.com/400x400?text=No+Image',
      quantity: 1,
      stock: product.stock,
    });
    toast.success(isRTL ? 'تمت الإضافة إلى السلة' : 'Added to cart');
  };

  const handleWishlist = () => {
    toggleWishlist(product.id);
    toast.success(
      isWishlisted
        ? isRTL ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist'
        : isRTL ? 'تمت الإضافة إلى المفضلة' : 'Added to wishlist'
    );
  };

  const thumbnail =
    !imageError && (product.images?.[0] || product.thumbnail)
      ? (product.images?.[0] || product.thumbnail || 'https://via.placeholder.com/400x400?text=No+Image')
      : 'https://via.placeholder.com/400x400?text=No+Image';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
        {product.isFeatured && (
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Zap className="w-3 h-3" />
            {isRTL ? 'مميز' : 'Featured'}
          </span>
        )}
        {discountPercent > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            -{discountPercent}%
          </span>
        )}
        {isOutOfStock && (
          <span className="bg-gray-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            {isRTL ? 'نفدت الكمية' : 'Out of Stock'}
          </span>
        )}
      </div>

      <button
        onClick={handleWishlist}
        className={cn(
          'absolute top-3 end-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md',
          isWishlisted
            ? 'bg-red-500 text-white scale-110'
            : 'bg-card text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100'
        )}
      >
        <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
      </button>

      <Link href={`/products/${product.slug || product.id}`}>
        <div className="relative aspect-square bg-secondary/30 overflow-hidden">
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white dark:bg-gray-800 text-foreground rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-lg transform -translate-y-2 group-hover:translate-y-0">
              <Eye className="w-3 h-3" />
              {isRTL ? 'عرض التفاصيل' : 'View Details'}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <div>
          {product.brand && (
            <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">{product.brand}</p>
          )}
          <Link href={`/products/${product.slug || product.id}`}>
            <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
              {name}
            </h3>
          </Link>
        </div>

        {(product.avgRating || 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn('w-3 h-3', s <= Math.round(product.avgRating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product._count?.reviews || 0})</span>
          </div>
        )}

        <div className="flex items-end gap-2">
          <span className="text-lg font-black text-primary">{formatPrice(effectivePrice)}</span>
          {product.discountPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
            isOutOfStock
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/20'
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          {isOutOfStock ? (isRTL ? 'نفدت الكمية' : 'Out of Stock') : (isRTL ? 'أضف إلى السلة' : 'Add to Cart')}
        </button>
      </div>
    </motion.div>
  );
}
