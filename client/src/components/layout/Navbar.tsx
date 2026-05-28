import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, Search, Menu, X,
  Sun, Moon, Globe, User, LogOut, Package, Wallet, Settings,
  ChevronDown,
} from 'lucide-react';
import { useCartStore } from '../../lib/store';
import SiteBrand from './SiteBrand';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useLocale } from '../../context/LocaleContext';
import { useMessages } from '../../lib/i18n';
import { cn } from '../../lib/utils';

export default function Navbar() {
  const { locale, setLocale, isRTL } = useLocale();
  const t = useMessages(locale, 'nav');
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { walletEnabled } = useSiteSettings();
  const { theme, setTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const itemCount = useCartStore((s) => s.itemCount());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const switchLanguage = () => setLocale(locale === 'ar' ? 'en' : 'ar');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/products', label: t('products') },
    { href: '/products?category=laptops', label: t('laptops') },
    { href: '/products?offers=true', label: t('offers') },
    { href: '/support', label: t('support') },
  ];

  return (
    <>
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-background/95 backdrop-blur-lg border-b border-border shadow-lg' : 'bg-background/80 backdrop-blur-sm'
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <SiteBrand size="md" nameClassName="text-xl hidden sm:block" />
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    location === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setSearchOpen(!searchOpen)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                <Search className="w-4 h-4" />
              </button>
              <button onClick={switchLanguage} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-xs font-bold">
                {locale === 'ar' ? 'EN' : 'ع'}
              </button>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link href="/wishlist" className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                <Heart className="w-4 h-4" />
              </Link>
              <Link href="/cart" className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-all">
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium hidden md:block">{user?.name?.split(' ')[0] || user?.email}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          'absolute top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50',
                          isRTL ? 'left-0' : 'right-0'
                        )}
                        onMouseLeave={() => setUserMenuOpen(false)}
                      >
                        <div className="p-2 space-y-0.5">
                          {[
                            { href: '/profile', icon: User, label: t('profile') },
                            { href: '/orders', icon: Package, label: t('orders') },
                            ...(walletEnabled ? [{ href: '/wallet', icon: Wallet, label: t('wallet') }] : []),
                          ].map(({ href, icon: Icon, label }) => (
                            <Link key={href} href={href} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-sm transition-colors">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              {label}
                            </Link>
                          ))}
                          {isAdmin && (
                            <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-sm transition-colors text-primary">
                              <Settings className="w-4 h-4" />
                              {t('admin')}
                            </Link>
                          )}
                          <hr className="border-border my-1" />
                          <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-sm text-destructive transition-colors">
                            <LogOut className="w-4 h-4" />
                            {t('logout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/auth/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  {t('login')}
                </Link>
              )}

              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent transition-all">
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-background/95 backdrop-blur-lg">
              <div className="container mx-auto px-4 py-3">
                <form onSubmit={handleSearch} className="flex gap-3">
                  <input
                    autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={locale === 'ar' ? 'ابحث عن منتج...' : 'Search products...'}
                    className="flex-1 px-4 py-2.5 bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                  <button type="submit" className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
                    {locale === 'ar' ? 'بحث' : 'Search'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border bg-background/95 backdrop-blur-lg">
              <div className="container mx-auto px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent transition-all">
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <div className="h-16" />
    </>
  );
}
