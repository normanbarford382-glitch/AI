import { Link } from 'wouter';
import { Facebook, Instagram, Twitter, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useMessages } from '../../lib/i18n';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import SiteBrand from './SiteBrand';

export default function Footer() {
  const { locale } = useLocale();
  const { siteName, walletEnabled } = useSiteSettings();
  const t = useMessages(locale, 'footer');
  const nt = useMessages(locale, 'nav');

  const quickLinks = [
    { href: '/', label: nt('home') },
    { href: '/products', label: nt('products') },
    { href: '/products?featured=true', label: nt('offers') },
    { href: '/support', label: nt('support') },
  ];

  return (
    <footer className="footer-premium border-t border-border mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <SiteBrand size="lg" nameClassName="text-xl" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {locale === 'ar' ? 'أفضل متجر للابتوبات في المنطقة. جودة عالية، أسعار منافسة، وخدمة عملاء متميزة.' : 'The best laptop store in the region. High quality, competitive prices, and excellent customer service.'}
            </p>
            <div className="flex items-center gap-3">
              {[
 { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61573755696526', label: 'Facebook' },
                { icon: Instagram, href: '', label: 'Instagram' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: MessageCircle, href: 'https://wa.me/963940730418', label: 'WhatsApp' },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-200 hover:scale-110">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-foreground">{locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-foreground">{locale === 'ar' ? 'حسابي' : 'My Account'}</h4>
            <ul className="space-y-2">
              {[
                { href: '/profile', label: locale === 'ar' ? 'الملف الشخصي' : 'Profile' },
                { href: '/orders', label: locale === 'ar' ? 'طلباتي' : 'My Orders' },
                ...(walletEnabled ? [{ href: '/wallet', label: locale === 'ar' ? 'المحفظة' : 'Wallet' }] : []),
                { href: '/wishlist', label: locale === 'ar' ? 'المفضلة' : 'Wishlist' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-foreground">{locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}</h4>
            <div className="space-y-3">
              {[
                { icon: Phone, text: '+963 940 730 418', href: 'tel:+963940730418' },
                { icon: Mail, text: 'dubailaptop567@gmail.com', href: 'mailto:dubailaptop567@gmail.com' },
{ icon: MapPin, text: locale === 'ar' ? 'حماه_ساحة العاصي_دخلة حلويات سلورة عبود ' : 'Damascus, Syria' },              ].map(({ icon: Icon, text, href }) => (
                href ? (
                  <a key={text} href={href} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    {text}
                  </a>
                ) : (
                  <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    {text}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 {siteName}. {locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <div className="flex items-center gap-4">
            {[
              { href: '/privacy', label: locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy' },
              { href: '/terms', label: locale === 'ar' ? 'الشروط والأحكام' : 'Terms of Service' },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
