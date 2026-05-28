import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Users, Package, ShoppingCart, TrendingUp, Clock, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { formatPrice, formatDate } from '../../lib/utils';
import api from '../../lib/api';

export default function AdminDashboard() {
  const { locale } = useLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<any>('/admin/dashboard'),
  });

  const stats = data?.stats;
  const recentOrders = data?.recentOrders || [];

  const statCards = [
    { icon: Users, label: locale === 'ar' ? 'المستخدمون' : 'Users', value: stats?.totalUsers ?? 0, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { icon: Package, label: locale === 'ar' ? 'المنتجات' : 'Products', value: stats?.totalProducts ?? 0, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
    { icon: ShoppingCart, label: locale === 'ar' ? 'الطلبات' : 'Orders', value: stats?.totalOrders ?? 0, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { icon: TrendingUp, label: locale === 'ar' ? 'الإيرادات' : 'Revenue', value: formatPrice(stats?.totalRevenue ?? 0), color: 'text-green-500 bg-green-50 dark:bg-green-900/20', isText: true },
  ];

  const statusConfig: Record<string, { icon: any; ar: string; en: string; color: string }> = {
    PENDING: { icon: Clock, ar: 'قيد الانتظار', en: 'Pending', color: 'text-amber-500' },
    PROCESSING: { icon: Package, ar: 'قيد المعالجة', en: 'Processing', color: 'text-blue-500' },
    SHIPPED: { icon: Truck, ar: 'تم الإرسال', en: 'Shipped', color: 'text-purple-500' },
    DELIVERED: { icon: CheckCircle, ar: 'مكتمل', en: 'Delivered', color: 'text-green-500' },
    CANCELLED: { icon: AlertCircle, ar: 'ملغي', en: 'Cancelled', color: 'text-red-500' },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-header">{locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{locale === 'ar' ? 'نظرة عامة على المتجر' : 'Store overview'}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="admin-stat-card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-black text-foreground mt-0.5">{isLoading ? '...' : value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pending alerts */}
        {stats?.pendingOrders > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {locale === 'ar' ? `${stats.pendingOrders} طلبات تنتظر المعالجة` : `${stats.pendingOrders} orders awaiting processing`}
              </p>
            </div>
            <Link href="/admin/orders" className="text-xs font-bold text-amber-600 hover:underline">
              {locale === 'ar' ? 'عرض الطلبات' : 'View Orders'}
            </Link>
          </div>
        )}

        {/* Recent Orders */}
        <div className="card-premium overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-bold text-foreground">{locale === 'ar' ? 'آخر الطلبات' : 'Recent Orders'}</h2>
            <Link href="/admin/orders" className="text-xs text-primary font-semibold hover:underline">
              {locale === 'ar' ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">{locale === 'ar' ? 'لا توجد طلبات' : 'No orders'}</div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.slice(0, 8).map((order: any) => {
                const sc = statusConfig[order.status] || statusConfig.PENDING;
                const Icon = sc.icon;
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${sc.color}`} />
                      <div>
                        <p className="text-sm font-semibold">#{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{order.user?.name || order.user?.email || order.fullName}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-bold text-primary">{formatPrice(order.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt, locale)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
