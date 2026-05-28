import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, ArrowLeft, Minus, Plus, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ProductCard from '../components/products/ProductCard';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useCartStore, useWishlistStore } from '../lib/store';
import { cn, formatPrice, getDiscountPercent } from '../lib/utils';
import api from '../lib/api';
import type { Product, Review } from '../types';

interface ProductDetail extends Product {
  reviews: Review[];
  related?: Product[];
}

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/600x600?text=No+Image';

function normalizeProductImages(images: unknown, thumbnail?: string | null): string[] {
  let list: string[] = [];

  if (Array.isArray(images)) {
    list = images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
  } else if (typeof images === 'string') {
    const value = images.trim();
    if (value) {
      if (value.startsWith('[')) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            list = parsed.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
          }
        } catch {
          /* treat as single URL below */
        }
      }
      if (!list.length) list = [value];
    }
  }

  if (!list.length && thumbnail?.trim()) list = [thumbnail.trim()];
  return list.length ? list : [PLACEHOLDER_IMAGE];
}

export default function ProductDetailPage() {
  const { locale, isRTL } = useLocale();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const addToCart = useCartStore(s => s.addItem);
  const { toggle: toggleWishlist, has: inWishlist } = useWishlistStore();
  const qc = useQueryClient();

  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setSelectedImage(0);
  }, [params.id]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: product, isLoading } = useQuery<ProductDetail>({
    queryKey: ['product', params.id],
    enabled: !!params.id,
    queryFn: async () => {
      const res = await api.get<{ product: ProductDetail }>(`/products/${params.id}`);
      return res.product;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (productId: string) => api.post(`/products/${productId}/reviews`, { rating, comment }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم إضافة تقييمك' : 'Review added');
      qc.invalidateQueries({ queryKey: ['product', params.id] });
      setComment('');
      setRating(5);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return (
    <div className="min-h-screen"><Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted rounded-2xl animate-pulse" />
          <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-muted rounded-xl animate-pulse" />)}</div>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <div className="card-premium p-12 text-center max-w-md space-y-4">
            <p className="text-5xl font-black text-primary/20">404</p>
            <h2 className="text-xl font-bold">{locale === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</h2>
            <Link href="/products" className="btn-primary-lg inline-flex">{locale === 'ar' ? 'العودة للمنتجات' : 'Back to products'}</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const name = locale === 'ar' ? product.nameAr : product.nameEn;
  const description = locale === 'ar' ? product.descriptionAr : product.descriptionEn;
  const specs = locale === 'ar' ? product.specsAr : product.specsEn;
  const effectivePrice = product.discountPrice ?? product.price;
  const discountPercent = product.discountPrice ? getDiscountPercent(product.price, product.discountPrice) : 0;
  const images = normalizeProductImages(product.images, product.thumbnail);
  const activeImage = images[Math.min(selectedImage, images.length - 1)] ?? images[0];
  const isWishlisted = inWishlist(product.id);

  const handleAddToCart = () => {
    addToCart({
      id: product.id, name,
      price: product.price,
      discountPrice: product.discountPrice ?? undefined,
      image: activeImage,
      quantity: qty,
      stock: product.stock,
    });
    toast.success(locale === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to cart');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <button onClick={() => navigate('/products')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          {locale === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}
        </button>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden border border-border bg-secondary/20">
              <img src={activeImage} alt={name} className="w-full h-full object-contain" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={cn('flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all', selectedImage === i ? 'border-primary' : 'border-border hover:border-primary/40')}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            {product.brand && <p className="text-sm text-primary font-bold uppercase tracking-wide">{product.brand}</p>}
            <h1 className="text-2xl lg:text-3xl font-black text-foreground">{name}</h1>

            {product.avgRating && product.avgRating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn('w-4 h-4', s <= Math.round(product.avgRating!) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />)}</div>
                <span className="text-sm text-muted-foreground">({product.reviews?.length || 0} {locale === 'ar' ? 'تقييم' : 'reviews'})</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-primary">{formatPrice(effectivePrice)}</span>
              {product.discountPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
                  <span className="bg-red-100 text-red-600 text-sm font-bold px-3 py-1 rounded-full">-{discountPercent}%</span>
                </>
              )}
            </div>

            <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold', product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
              <span className={cn('w-2 h-2 rounded-full', product.stock > 0 ? 'bg-green-500' : 'bg-red-500')} />
              {product.stock > 0 ? (locale === 'ar' ? `${product.stock} قطعة متوفرة` : `${product.stock} in stock`) : (locale === 'ar' ? 'نفدت الكمية' : 'Out of Stock')}
            </div>

            {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}

            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{locale === 'ar' ? 'الكمية:' : 'Qty:'}</span>
                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-all"><Minus className="w-4 h-4" /></button>
                  <span className="w-12 text-center font-semibold">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-all"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                <ShoppingCart className="w-5 h-5" />
                {locale === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
              </button>
              <button onClick={() => { toggleWishlist(product.id); toast.success(isWishlisted ? (locale === 'ar' ? 'تم الحذف من المفضلة' : 'Removed from wishlist') : (locale === 'ar' ? 'تم الإضافة للمفضلة' : 'Added to wishlist')); }}
                className={cn('w-14 h-14 flex items-center justify-center rounded-2xl border border-border hover:border-primary transition-all', isWishlisted ? 'bg-red-500 text-white border-red-500' : 'bg-card')}>
                <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
              </button>
            </div>

            {specs && Object.keys(specs).length > 0 && (
              <div className="bg-muted rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-foreground">{locale === 'ar' ? 'المواصفات' : 'Specifications'}</h3>
                <div className="divide-y divide-border">
                  {Object.entries(specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 space-y-8">
          <h2 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'التقييمات' : 'Reviews'}</h2>
          {isAuthenticated && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold">{locale === 'ar' ? 'أضف تقييمك' : 'Add Your Review'}</h3>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star className={cn('w-6 h-6 transition-colors', s <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground hover:text-amber-300')} />
                  </button>
                ))}
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                placeholder={locale === 'ar' ? 'اكتب تقييمك هنا...' : 'Write your review...'}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <button onClick={() => reviewMutation.mutate(product.id)} disabled={reviewMutation.isPending}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50">
                {reviewMutation.isPending ? (locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : (locale === 'ar' ? 'إرسال التقييم' : 'Submit Review')}
              </button>
            </div>
          )}
          {!product.reviews?.length ? (
            <p className="text-muted-foreground text-center py-8">{locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
          ) : (
            <div className="space-y-4">
              {product.reviews?.map(review => (
                <div key={review.id} className="bg-card border border-border rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{(review.user as any)?.name || (locale === 'ar' ? 'مجهول' : 'Anonymous')}</span>
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn('w-3 h-3', s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />)}</div>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
