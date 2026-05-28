import { type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Package, ShoppingCart, Users, Image, Settings, Wallet, MessageSquare, LogOut, Menu, X, FolderOpen, CreditCard } from 'lucide-react';
import SiteBrand from '../../components/layout/SiteBrand';
import { useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, ar: 'لوحة التحكم', en: 'Dashboard' },
  { href: '/admin/orders', icon: ShoppingCart, ar: 'الطلبات', en: 'Orders' },
  { href: '/admin/products', icon: Package, ar: 'المنتجات', en: 'Products' },
  { href: '/admin/categories', icon: FolderOpen, ar: 'الفئات', en: 'Categories' },
  { href: '/admin/users', icon: Users, ar: 'المستخدمون', en: 'Users' },
  { href: '/admin/banners', icon: Image, ar: 'البانرات', en: 'Banners' },
  { href: '/admin/wallet', icon: Wallet, ar: 'شحن المحفظة', en: 'Wallet Topups' },
  { href: '/admin/payment-methods', icon: CreditCard, ar: 'طرق الشحن', en: 'Recharge Methods' },
  { href: '/admin/messages', icon: MessageSquare, ar: 'الرسائل', en: 'Messages' },
  { href: '/admin/settings', icon: Settings, ar: 'الإعدادات', en: 'Settings' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { locale, isRTL } = useLocale();
  const { isAdmin, logout, user } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-destructive">{locale === 'ar' ? 'غير مصرح لك بالدخول' : 'Access Denied'}</h2>
          <Link href="/" className="block px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
        </div>
      </div>
    );
  }

  const Sidebar = () => (
    <div className="w-64 bg-sidebar text-sidebar-foreground border-e border-sidebar-border flex flex-col h-full shadow-xl">
      <div className="p-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <SiteBrand size="sm" nameClassName="text-sm" />
        </Link>
        <p className="text-xs text-muted-foreground mt-1">{locale === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, ar, en }) => (
          <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              location === href ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}>
            <Icon className="w-4 h-4" />
            {locale === 'ar' ? ar : en}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{(user?.name || user?.email || 'A')[0].toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all">
          <LogOut className="w-4 h-4" />
          {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden admin-panel">
      <div className="hidden lg:flex flex-col h-full">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex flex-col h-full">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border bg-card/95 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors" aria-label="Menu">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <p className="text-sm font-semibold text-muted-foreground hidden sm:block">
            {locale === 'ar' ? 'لوحة إدارة المتجر' : 'Store Administration'}
          </p>
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
