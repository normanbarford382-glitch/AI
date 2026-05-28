import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, AlertCircle, Wallet, Banknote } from 'lucide-react';
import StorePageShell from '../components/shared/StorePageShell';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate, cn } from '../lib/utils';
import api from '../lib/api';
import type { Order } from '../types';

const statusConfig = {
  PENDING: { icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', ar: 'قيد الانتظار', en: 'Pending' },
  PROCESSING: { icon: Package, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', ar: 'قيد المعالجة', en: 'Processing' },
  SHIPPED: { icon: Truck, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20', ar: 'تم الإرسال', en: 'Shipped' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-500 bg-green-50 dark:bg-green-900/20', ar: 'مكتمل', en: 'Delivered' },
  CANCELLED: { icon: XCircle, color: 'text-red-500 bg-red-50 dark:bg-red-900/20', ar: 'ملغي', en: 'Cancelled' },
  OUT_OF_STOCK: { icon: AlertCircle, color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', ar: 'نفدت الكمية', en: 'Out of Stock' },
};

export default function OrdersPage() {
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <StorePageShell mainClassName="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={Package}
          title={locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please sign in first'}
          action={
            <Link href="/auth/login" className="btn-primary-lg">
              {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          }
        />
      </StorePageShell>
    );
  }

  return (
    <StorePageShell>
        <PageHeader title={locale === 'ar' ? 'طلباتي' : 'My Orders'} />
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : !data?.orders?.length ? (
          <EmptyState
            icon={Package}
            title={locale === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}
            action={
              <Link href="/products" className="btn-primary-lg">
                {locale === 'ar' ? 'ابدأ التسوق' : 'Start Shopping'}
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {data.orders.map(order => {
              const status = order.status as keyof typeof statusConfig;
              const sc = statusConfig[status] || statusConfig.PENDING;
              const Icon = sc.icon;
              return (
                <div key={order.id} onClick={() => navigate(`/orders/${order.id}`)}
                  className="card-premium p-5 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', sc.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">#{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt, locale)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <p className="font-bold text-primary">{formatPrice(order.totalAmount)}</p>
                        <span className={cn('badge-status', sc.color)}>
                          {locale === 'ar' ? sc.ar : sc.en}
                        </span>
                        <span className={cn('badge-status mt-1', order.paidFromWallet ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                          {order.paidFromWallet ? (
                            <><Wallet className="w-3 h-3" />{locale === 'ar' ? 'محفظة' : 'Wallet'}</>
                          ) : (
                            <><Banknote className="w-3 h-3" />{locale === 'ar' ? 'عند الاستلام' : 'COD'}</>
                          )}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground ${locale === 'ar' ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-hidden">
                      {order.items.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="w-10 h-10 rounded-lg border border-border overflow-hidden bg-muted flex-shrink-0">
                          {item.products?.thumbnail && <img src={item.products.thumbnail} alt="" className="w-full h-full object-cover" />}
                        </div>
                      ))}
                      {order.items.length > 4 && <div className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">+{order.items.length - 4}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </StorePageShell>
  );
}
