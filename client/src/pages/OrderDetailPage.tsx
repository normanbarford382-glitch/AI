import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, ArrowLeft, MapPin, CreditCard, MessageSquare, Image } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate, cn } from '../lib/utils';
import api from '../lib/api';
import type { Order } from '../types';

const statusConfig: Record<string, { icon: any; color: string; ar: string; en: string }> = {
  PENDING: { icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', ar: 'قيد الانتظار', en: 'Pending' },
  PROCESSING: { icon: Package, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', ar: 'قيد المعالجة', en: 'Processing' },
  SHIPPED: { icon: Truck, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20', ar: 'تم الإرسال', en: 'Shipped' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-500 bg-green-50 dark:bg-green-900/20', ar: 'مكتمل', en: 'Delivered' },
  CANCELLED: { icon: XCircle, color: 'text-red-500 bg-red-50 dark:bg-red-900/20', ar: 'ملغي', en: 'Cancelled' },
  OUT_OF_STOCK: { icon: AlertCircle, color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', ar: 'نفدت الكمية', en: 'Out of Stock' },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<{ order: Order & { items: any[]; adminNote?: string; shippingReceiptUrl?: string } }>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`),
    enabled: isAuthenticated && !!id,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">{locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first'}</p>
          <button onClick={() => navigate('/auth/login')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all">
            {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const order = data?.order;
  const status = order ? (statusConfig[order.status] ?? statusConfig.PENDING) : null;
  const StatusIcon = status?.icon ?? Clock;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <button onClick={() => navigate('/orders')}
          className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
          {locale === 'ar' ? 'العودة للطلبات' : 'Back to Orders'}
        </button>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : error || !order ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{locale === 'ar' ? 'الطلب غير موجود' : 'Order not found'}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-black text-foreground mb-1">
                  {locale === 'ar' ? 'طلب رقم' : 'Order'} #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
              </div>
              <span className={cn('flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full', status?.color)}>
                <StatusIcon className="w-4 h-4" />
                {locale === 'ar' ? status?.ar : status?.en}
              </span>
            </div>

            {(order.adminNote || order.shippingReceiptUrl) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-blue-800 dark:text-blue-300">
                    {locale === 'ar' ? 'رسالة من الإدارة' : 'Message from Admin'}
                  </p>
                </div>
                {order.adminNote && (
                  <p className="text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 rounded-xl p-3 leading-relaxed">
                    {order.adminNote}
                  </p>
                )}
                {order.shippingReceiptUrl && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                        {locale === 'ar' ? 'إيصال الشحن' : 'Shipping Receipt'}
                      </span>
                    </div>
                    <a href={order.shippingReceiptUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={order.shippingReceiptUrl}
                        alt={locale === 'ar' ? 'إيصال الشحن' : 'Shipping Receipt'}
                        className="max-w-xs rounded-xl border border-blue-200 shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    </a>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {locale === 'ar' ? 'اضغط على الصورة للتكبير' : 'Click image to enlarge'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {locale === 'ar' ? 'المنتجات' : 'Items'}
              </h2>
              <div className="space-y-3">
                {(order.items || []).map((item: any) => {
                  const product = item.products || item.product;
                  const price = item.order_items?.price ?? item.price ?? item.unitPrice ?? 0;
                  const qty = item.order_items?.quantity ?? item.quantity ?? 1;
                  const nameAr = product?.nameAr || product?.name_ar || item.productNameAr || '';
                  const nameEn = product?.nameEn || product?.name_en || item.productNameEn || '';
                  const thumbnail = product?.thumbnail;
                  return (
                    <div key={item.order_items?.id || item.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      {thumbnail ? (
                        <img src={thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">
                          {locale === 'ar' ? nameAr : nameEn}
                        </p>
                        <p className="text-xs text-muted-foreground">{locale === 'ar' ? `الكمية: ${qty}` : `Qty: ${qty}`}</p>
                      </div>
                      <p className="font-bold text-primary flex-shrink-0">{formatPrice(price * qty)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {locale === 'ar' ? 'بيانات التوصيل' : 'Delivery Details'}
              </h2>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {(order as any).fullName && (
                  <div><span className="text-muted-foreground">{locale === 'ar' ? 'الاسم: ' : 'Name: '}</span><span className="font-medium">{(order as any).fullName}</span></div>
                )}
                {(order as any).phone && (
                  <div><span className="text-muted-foreground">{locale === 'ar' ? 'واتساب: ' : 'WhatsApp: '}</span><span className="font-medium">{(order as any).phone}</span></div>
                )}
                {(order as any).address && (
                  <div><span className="text-muted-foreground">{locale === 'ar' ? 'المحافظة: ' : 'Governorate: '}</span><span className="font-medium">{(order as any).address}</span></div>
                )}
                {(order as any).shippingBranch && (
                  <div><span className="text-muted-foreground">{locale === 'ar' ? 'فرع الشحن: ' : 'Shipping Branch: '}</span><span className="font-medium">{(order as any).shippingBranch}</span></div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                {locale === 'ar' ? 'ملخص الدفع' : 'Payment Summary'}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</span>
                  <span>{order.paymentMethod === 'WALLET' ? (locale === 'ar' ? 'المحفظة' : 'Wallet') : (locale === 'ar' ? 'عند الاستلام' : 'Cash on Delivery')}</span>
                </div>
                {(order as any).discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{locale === 'ar' ? 'الخصم' : 'Discount'}</span>
                    <span>- {formatPrice((order as any).discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base pt-2 border-t border-border">
                  <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
